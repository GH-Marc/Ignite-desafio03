import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const estimatedReadTime = Math.ceil(
    post.data.content
      .map(content => {
        const headingWords = +content.heading.split(' ').length;
        const bodyWords = +RichText.asText(content.body).split(' ').length;
        const total = headingWords + bodyWords;

        return total;
      })
      .reduce((acc, value) => {
        return acc + value;
      }) / 200
  );

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>spacetraveling | {post.data.title}</title>
      </Head>

      <div className={styles.container}>
        <Header />

        <img src={post.data.banner.url} alt="banner" />

        <div className={styles.content}>
          <strong className={styles.title}>{post.data.title}</strong>
          <span className={styles.info}>
            <section>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </section>
            <section>
              <FiUser />
              {post.data.author}
            </section>
            <section>
              <FiClock />
              {estimatedReadTime} min
            </section>
          </span>
          {post.data.content.map(content => (
            <div key={content.heading} className={styles.textContent}>
              <h1>{content.heading}</h1>
              <section>
                {content.body.map((body, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <p key={i}>{body.text}</p>
                ))}
              </section>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const results = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: results,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
